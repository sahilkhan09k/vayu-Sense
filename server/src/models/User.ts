import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'city_authority' | 'state_authority';
  city: string | null;
  state: string | null;
  isCredentialGenerated: boolean;
  tempPasswordChanged: boolean;
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Ensures password hash is not loaded by default
  },
  role: {
    type: String,
    enum: ['citizen', 'city_authority', 'state_authority'],
    default: 'citizen',
  },
  city: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  isCredentialGenerated: {
    type: Boolean,
    default: false,
  },
  tempPasswordChanged: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure password hash is never returned in queries by default
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

const MongooseUser = mongoose.model<IUser>('User', userSchema);

// --- In-Memory Mock Database Fallback ---
const mockUsers: any[] = [
  {
    _id: 'mock_state_1',
    name: 'Maharashtra State Authority',
    email: 'state@maharashtra.gov.in',
    passwordHash: bcrypt.hashSync('VayuState@2026', 10),
    role: 'state_authority',
    state: 'Maharashtra',
    city: null,
    isCredentialGenerated: false,
    tempPasswordChanged: true,
    createdBy: null,
    createdAt: new Date(),
  },
  {
    _id: 'mock_city_1',
    name: 'Mumbai City Administrator',
    email: 'mumbai.admin@maharashtra.gov.in',
    passwordHash: bcrypt.hashSync('VayuCity@2026', 10),
    role: 'city_authority',
    state: 'Maharashtra',
    city: 'Mumbai',
    isCredentialGenerated: true,
    tempPasswordChanged: true,
    createdBy: 'mock_state_1',
    createdAt: new Date(),
  },
  {
    _id: 'mock_city_2',
    name: 'Mumbai New Officer',
    email: 'mumbai.new@maharashtra.gov.in',
    passwordHash: bcrypt.hashSync('TempMumbai2026', 10),
    role: 'city_authority',
    state: 'Maharashtra',
    city: 'Mumbai',
    isCredentialGenerated: true,
    tempPasswordChanged: false,
    createdBy: 'mock_state_1',
    createdAt: new Date(),
  },
  {
    _id: 'mock_citizen_1',
    name: 'Demo Citizen',
    email: 'citizen@demo.com',
    passwordHash: bcrypt.hashSync('Citizen@2026', 10),
    role: 'citizen',
    state: null,
    city: 'Mumbai',
    isCredentialGenerated: false,
    tempPasswordChanged: true,
    createdBy: null,
    createdAt: new Date(),
  },
];
let mockIdCounter = 5;

class MockQuery {
  private result: any;
  constructor(result: any) {
    this.result = result;
  }
  select() {
    return this;
  }
  then(resolve: any) {
    resolve(this.result);
  }
}

function wrapMockUser(user: any) {
  if (!user) return null;
  return {
    ...user,
    _id: user._id,
    id: user._id,
    toJSON() {
      const copy = { ...user };
      delete copy.passwordHash;
      copy.id = user._id;
      return copy;
    },
    toObject() {
      const copy = { ...user };
      copy.id = user._id;
      return copy;
    }
  };
}

const MockUserModel = {
  findOne: function (query: any) {
    if (query.email) {
      const email = query.email.toLowerCase();
      const user = mockUsers.find((u) => u.email === email);
      return new MockQuery(wrapMockUser(user));
    }
    return new MockQuery(null);
  },
  find: function (query: any) {
    let results = [...mockUsers];
    if (query.createdBy) {
      results = results.filter((u) => u.createdBy === query.createdBy);
    }
    if (query.role) {
      results = results.filter((u) => u.role === query.role);
    }
    return {
      sort: function (_sort: Record<string, number>) {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return this;
      },
      then(resolve: (value: unknown) => void) {
        resolve(results.map(wrapMockUser));
      },
    };
  },
  create: async function (data: any) {
    const newUser = {
      _id: `mock_${mockIdCounter++}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role || 'citizen',
      city: data.city || null,
      state: data.state || null,
      isCredentialGenerated: data.isCredentialGenerated || false,
      tempPasswordChanged: data.tempPasswordChanged !== undefined ? data.tempPasswordChanged : true,
      createdBy: data.createdBy || null,
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return wrapMockUser(newUser);
  },
  findById: function (id: string) {
    const user = mockUsers.find((u) => u._id === id);
    return new MockQuery(wrapMockUser(user));
  },
  findByIdAndUpdate: function (id: string, update: any, _options?: any) {
    const index = mockUsers.findIndex((u) => u._id === id);
    if (index === -1) return new MockQuery(null);
    mockUsers[index] = {
      ...mockUsers[index],
      ...update,
    };
    return new MockQuery(wrapMockUser(mockUsers[index]));
  },
};


// Dynamic model selection — Proxy breaks Mongoose (model is not a constructor)
export function getUserModel(): any {
  if (process.env.USE_MOCK_DB === 'true') {
    return MockUserModel;
  }
  return MongooseUser;
}

