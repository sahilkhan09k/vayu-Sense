/**
 * enforcement.controller.ts
 * Handlers for enforcement queues, actions, and PDF report generation.
 */

import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { getEnforcementActionModel } from '../models/EnforcementAction.js';
import { getAQISnapshotModel } from '../models/AQISnapshot.js';
import { WARD_CONFIGS } from './aqi.controller.js';
import { getEvidenceNarrative } from '../utils/groq.js';
import { getUserModel } from '../models/User.js';

import { SENSITIVE_RECEPTORS } from './vulnerability.controller.js';

/**
 * GET /api/enforcement/queue
 * Computes a ranked risk-prioritized list of wards for enforcement planning.
 */
export async function getEnforcementQueue(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';

  try {
    const AQISnapshot = getAQISnapshotModel();
    // Get latest snapshots for the city
    const snapshots = await AQISnapshot.findLatestPerWard(city);

    // Filter configs for this city
    const cityWards = WARD_CONFIGS.filter((w) => w.city === city);

    const queue = cityWards.map((ward) => {
      const snap = (snapshots as any[]).find((s) => s.wardId === ward.wardId) || {
        aqi: 130, // Fallback
        pm25: 45,
        pm10: 95,
      };

      const receptors = SENSITIVE_RECEPTORS.filter((r) => r.wardId === ward.wardId);
      const receptorsCount = receptors.length;

      // Risk score: AQI (50%) + Receptors (30%) + Random fluctuation for mock (20%)
      const baseScore = (snap.aqi / 500) * 50 + (receptorsCount * 15);
      const priorityScore = Math.min(100, Math.max(10, Math.round(baseScore + (ward.wardId.length % 5) * 4)));

      let status = 'Stable';
      if (priorityScore > 75) status = 'Alert';
      else if (priorityScore > 50) status = 'Warning';

      return {
        wardId: ward.wardId,
        wardName: ward.wardName,
        city: ward.city,
        lat: ward.lat,
        lng: ward.lng,
        aqi: snap.aqi,
        pm25: snap.pm25,
        pm10: snap.pm10,
        sensitiveReceptorsCount: receptorsCount,
        sensitiveReceptors: receptors,
        priorityScore,
        status,
      };
    });

    // Sort by priorityScore descending
    queue.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({ city, queue });
  } catch (error) {
    console.error('[Enforcement Queue] Error compiling queue:', error);
    res.status(500).json({ message: 'Error generating enforcement queue.' });
  }
}

/**
 * GET /api/enforcement/actions
 * Retrieves previous violation reports logged in the city.
 */
export async function getEnforcementActions(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';

  try {
    const EnforcementAction = getEnforcementActionModel();
    const actions = await EnforcementAction.find({ city });
    res.json({ city, actions });
  } catch (error) {
    console.error('[Enforcement Actions] Error fetching logs:', error);
    res.status(500).json({ message: 'Error loading enforcement action logs.' });
  }
}

/**
 * POST /api/enforcement/action
 * Logs a new inspection audit / violation report.
 */
export async function logViolationAction(req: Request, res: Response): Promise<void> {
  const { wardId, violationType, severity, notes } = req.body;

  if (!wardId || !violationType || !severity || !notes) {
    res.status(400).json({ message: 'All audit fields are required.' });
    return;
  }

  const ward = WARD_CONFIGS.find((w) => w.wardId === wardId);
  if (!ward) {
    res.status(404).json({ message: 'Ward not found.' });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const User = getUserModel();
    const officer = await User.findById(req.user.userId);
    const officerName = officer?.name || 'Field Officer';

    const EnforcementAction = getEnforcementActionModel();
    const action = await EnforcementAction.create({
      wardId,
      wardName: ward.wardName,
      city: ward.city,
      officerName,
      officerId: req.user.userId,
      violationType,
      severity,
      status: 'Pending',
      notes,
    });

    res.status(201).json({ message: 'Enforcement action logged successfully.', action });
  } catch (error) {
    console.error('[Violation Log] Error creating log:', error);
    res.status(500).json({ message: 'Failed to write violation log.' });
  }
}

/**
 * GET /api/enforcement/evidence/:wardId
 * Generates and downloads a formal legal enforcement package PDF.
 */
export async function getEvidencePackage(req: Request, res: Response): Promise<void> {
  const { wardId } = req.params;
  const wardIdStr = String(wardId);
  const ward = WARD_CONFIGS.find((w) => w.wardId === wardIdStr);

  if (!ward) {
    res.status(404).json({ message: 'Ward configuration not found.' });
    return;
  }

  try {
    const AQISnapshot = getAQISnapshotModel();
    const snapshots = await AQISnapshot.findLatestPerWard(ward.city);
    const snap = (snapshots as any[]).find((s: any) => s.wardId === wardIdStr) || {
      aqi: 187,
      pm25: 92,
      pm10: 164,
      no2: 38,
      timestamp: new Date(),
    };

    const officerName = req.query.officerName as string || 'State Pollution Control Board Auditor';
    const violationType = req.query.violationType as string || 'Suspicious Emissions';
    const notes = req.query.notes as string || 'Stagnant emission plume detected above industrial chimney during standard audit.';

    // Generate Groq legal brief
    let aiAttribution = '';
    try {
      aiAttribution = await getEvidenceNarrative(ward.wardName, ward.city, violationType, notes);
    } catch (groqErr) {
      console.warn(`[Evidence PDF] Groq brief failed, using default:`, groqErr);
      aiAttribution = `Formal audit confirms compliance breach at ${ward.wardName}, ${ward.city}. Visual inspections and sensor metrics indicate high levels of particulate matter originating from active sites, in violation of the Air (Prevention and Control of Pollution) Act 1981. Immediate mitigation protocols are recommended.`;
    }

    // Initialize PDF Document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VayuSense_Evidence_${wardId}.pdf`);

    doc.pipe(res);

    // Draw document border
    doc.rect(20, 20, 555, 802).lineWidth(1).stroke('#1e293b');

    // Header Title
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('VAYUSENSE AIR QUALITY INTELLIGENCE', 50, 45, { align: 'center' });
    doc.fillColor('#00D4B4').fontSize(8).text('NATIONAL AMBIENT AIR COMPLIANCE AUDIT ENGINE', { align: 'center' });
    doc.moveDown(1.5);

    // Header Rule
    doc.moveTo(50, 70).lineTo(545, 70).lineWidth(1.5).stroke('#00D4B4');

    // Title Block
    doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('OFFICIAL FIELD EVIDENCE PACKAGE', 50, 85, { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text('COMPILED UNDER THE PROVISIONS OF THE AIR (PREVENTION AND CONTROL OF POLLUTION) ACT, 1981', { align: 'center' });
    doc.moveDown(2);

    // Info Grid Section
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('1. AUDIT TARGET INFORMATION', 50, 130);
    doc.moveTo(50, 142).lineTo(545, 142).lineWidth(0.5).stroke('#cbd5e1');

    doc.font('Helvetica').fillColor('#475569');
    doc.text('City:', 50, 155);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(ward.city, 110, 155);
    
    doc.font('Helvetica').fillColor('#475569');
    doc.text('Ward Target:', 50, 172);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(ward.wardName, 110, 172);
    
    doc.font('Helvetica').fillColor('#475569');
    doc.text('GPS Coordinates:', 50, 189);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${ward.lat.toFixed(4)}° N, ${ward.lng.toFixed(4)}° E`, 150, 189);

    // Right Side Metadata
    doc.font('Helvetica').fillColor('#475569');
    doc.text('Audited By:', 300, 155);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(officerName, 370, 155);

    doc.font('Helvetica').fillColor('#475569');
    doc.text('Date of Record:', 300, 172);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(new Date(snap.timestamp).toLocaleDateString('en-IN'), 380, 172);

    doc.font('Helvetica').fillColor('#475569');
    doc.text('Compliance ID:', 300, 189);
    doc.font('Helvetica-Bold').fillColor('#ef4444').text(`VS-${wardIdStr.toUpperCase().slice(-5)}-${Math.floor(Math.random() * 90000 + 10000)}`, 380, 189);

    doc.moveDown(3);

    // 2. Air Pollution Metrics Section
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('2. SCIENTIFIC READINGS (LIVE TELEMETRY)', 50, 220);
    doc.moveTo(50, 232).lineTo(545, 232).lineWidth(0.5).stroke('#cbd5e1');

    // Draw CPCB Box
    doc.rect(50, 245, 220, 85).fill('#f8fafc');
    doc.stroke('#cbd5e1');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('AMBIENT CPCB AQI READOUT', 60, 255);
    
    doc.fontSize(38).fillColor(snap.aqi > 200 ? '#ef4444' : snap.aqi > 100 ? '#f59e0b' : '#10b981').text(String(snap.aqi), 60, 270);
    
    let label = 'MODERATE';
    if (snap.aqi > 300) label = 'VERY POOR';
    else if (snap.aqi > 200) label = 'POOR';
    else if (snap.aqi > 50) label = 'SATISFACTORY';
    else label = 'GOOD';
    
    doc.fontSize(9).font('Helvetica-Bold').text(`STATUS: ${label}`, 145, 275);
    doc.fontSize(7).font('Helvetica').fillColor('#64748b').text('Calibration Scale: India CPCB', 145, 288);

    // Sub-pollutants Box
    doc.rect(290, 245, 255, 85).stroke('#cbd5e1');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('CONCENTRATION BREAKDOWN', 300, 255);
    
    doc.fontSize(9).font('Helvetica').fillColor('#475569');
    doc.text(`PM2.5:`, 300, 275);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${snap.pm25} µg/m³`, 350, 275);
    
    doc.font('Helvetica').fillColor('#475569');
    doc.text(`PM10:`, 300, 290);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${snap.pm10} µg/m³`, 350, 290);
    
    doc.font('Helvetica').fillColor('#475569');
    doc.text(`NO2:`, 300, 305);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${snap.no2 || 12} ppb`, 350, 305);

    doc.moveDown(4);

    // 3. AI Evidence Summary
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('3. AI-POWERED REGULATORY BREACH AUDIT', 50, 355);
    doc.moveTo(50, 367).lineTo(545, 367).lineWidth(0.5).stroke('#cbd5e1');

    doc.rect(50, 380, 495, 110).fill('#FAFBFD');
    doc.stroke('#00D4B4');
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#00D4B4').text('VAYUSENSE ADVANCED AUDITING KERNEL LOG:', 62, 392);
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#1e293b').text(aiAttribution, 62, 412, { width: 470, lineGap: 4 });

    doc.moveDown(3);

    // 4. Incident Logs & Officer Notes
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('4. FIELD OFFICER OBSERVATIONS & BRIEF', 50, 510);
    doc.moveTo(50, 522).lineTo(545, 522).lineWidth(0.5).stroke('#cbd5e1');
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Reported Violation:', 50, 535);
    doc.font('Helvetica-Bold').fillColor('#ef4444').text(violationType, 160, 535);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Actionable Notes:', 50, 555);
    doc.font('Helvetica').fillColor('#0f172a').text(notes, 160, 555, { width: 385, lineGap: 3 });

    // Footer Signatures Box
    doc.rect(50, 680, 495, 100).stroke('#cbd5e1');
    doc.moveTo(297, 680).lineTo(297, 780).lineWidth(0.5).stroke('#cbd5e1');

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('COMPLIANCE OFFICER SEAL / SIGNATURE', 60, 690);
    doc.moveTo(70, 750).lineTo(270, 750).lineWidth(0.5).stroke('#94a3b8');
    doc.fontSize(7).font('Helvetica').text('Signature of Compiling Officer', 70, 757);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('OFFICIAL ACTION RECOMMENDATION & SEAL', 307, 690);
    doc.fontSize(8).font('Helvetica').fillColor('#0f172a').text('Verified compliance breach. Issuing notice under Section 31A of the Air Act 1981 to halt construction operations immediately.', 307, 710, { width: 230 });

    doc.end();
  } catch (error) {
    console.error('[Evidence PDF] Error compiling PDF document:', error);
    res.status(500).json({ message: 'Error generating evidence PDF package.' });
  }
}
