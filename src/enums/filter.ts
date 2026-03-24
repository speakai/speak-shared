export enum FilterFieldName {
  Category = 'category',
  FolderId = 'folderId',
  MediaId = 'mediaId',
  MediaType = 'mediaType',
  SentimentNegative = 'sentimentNegative',
  SentimentPositive = 'sentimentPositive',
  Speaker = 'speaker',
  Tags = 'tags',
  RecorderId = 'recorderId',
  Fields = 'fields',
}

export enum FilterOperator {
  Include = 'include',
  NotInclude = 'notInclude',
  Contain = 'contain',
  NotContain = 'notContain',
  GreaterThan = 'greaterThan',
  LessThan = 'lessThan',
}

export enum FilterCondition {
  And = 'and',
  Or = 'or',
}
