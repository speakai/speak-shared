/** Media statuses an app shows that the server's `MediaState` has no value for; every other status comes from `MediaState`. */
export enum MediaUiState {
  UPLOADING = 'uploading',
  TAKING_LONGER = 'takingLonger',
  LOCAL_ONLY = 'localOnly',
}
