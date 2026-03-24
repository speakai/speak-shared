import { FieldType, AllowedValuesMode } from '../enums/index';

export interface IField {
  _id: string;
  fieldId?: string;
  id: string;
  name: string;
  description: string;
  type: FieldType;
  isActive: boolean;
  privacyMode: string;
  prompt?: string;
  allowedValues?: string[];
  allowedValuesMode?: AllowedValuesMode;
  otherValues?: boolean;
  notApplicableValues?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFieldValue {
  id: string;
  value: string;
}
