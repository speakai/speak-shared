export interface IExportOptions {
  isSpeakerNames?: boolean;
  isSpeakerEmail?: boolean;
  isTimeStamps?: boolean;
  isInsightVisualized?: boolean;
  isRedacted?: boolean;
  redactedCategories?: string[];
  isCustomizeExport?: boolean;
  fileType?: string;
  primaryColor?: string;
  isSeparateCSV?: boolean;
}

export interface IExportResult {
  url?: string;
  data?: unknown;
  fileType?: string;
}
