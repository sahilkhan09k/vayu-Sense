import { Request, Response } from 'express';
import { CALIBRATION_SCALES } from '../utils/aqiUtils.js';

/**
 * GET /api/settings
 * Retrieve current calibration scales and database mock mode.
 */
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    res.json({
      calibrationScales: CALIBRATION_SCALES,
      useMockDb: process.env.USE_MOCK_DB === 'true',
    });
  } catch (error) {
    console.error('[Settings] Error retrieving settings:', error);
    res.status(500).json({ message: 'Error retrieving settings.' });
  }
}

/**
 * POST /api/settings
 * Update calibration scales or database mock mode.
 */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { calibrationScales, useMockDb } = req.body;

  try {
    if (calibrationScales) {
      // Validate structure before assigning
      for (const city of ['Mumbai', 'Delhi', 'Bengaluru']) {
        if (calibrationScales[city]) {
          const { pm25, pm10, no2 } = calibrationScales[city];
          if (typeof pm25 === 'number' && typeof pm10 === 'number' && typeof no2 === 'number') {
            CALIBRATION_SCALES[city] = { pm25, pm10, no2 };
          }
        }
      }
    }

    if (typeof useMockDb === 'boolean') {
      process.env.USE_MOCK_DB = useMockDb ? 'true' : 'false';
    }

    res.json({
      message: 'Settings updated successfully.',
      calibrationScales: CALIBRATION_SCALES,
      useMockDb: process.env.USE_MOCK_DB === 'true',
    });
  } catch (error) {
    console.error('[Settings] Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings.' });
  }
}
