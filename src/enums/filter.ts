export enum FilterFieldName {
  CATEGORY = 'category',
  FOLDER_ID = 'folderId',
  MEDIA_ID = 'mediaId',
  MEDIA_TYPE = 'mediaType',
  SENTIMENT_NEGATIVE = 'sentimentNegative',
  SENTIMENT_POSITIVE = 'sentimentPositive',
  SPEAKER = 'speaker',
  TAGS = 'tags',
  RECORDER_ID = 'recorderId',
  FIELDS = 'fields',
}

export enum FilterOperator {
  INCLUDE = 'include',
  NOT_INCLUDE = 'notInclude',
  CONTAIN = 'contain',
  NOT_CONTAIN = 'notContain',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
}

export enum FilterCondition {
  AND = 'and',
  OR = 'or',
}
