export const DEFAULT_COLLAPSABLE: boolean = true;

export const DEFAULT_INITIALLY_COLLAPSED: boolean = false;

export const TOKEN_START_SYMBOLS: string = "{{";

export const TOKEN_END_SYMBOLS: string = "}}";

export const TOKEN_START_REGEX: RegExp = /\{\{/;

export const TOKEN_END_REGEX: RegExp = /\}\}/;

export const MESSAGES_IN_REVIEW_FILE_DATA_KEY: string = "IN_REVIEW_FILE_DATA";

export const FieldType: { [key: string]: string } = {
  BUTTON: "button",
  CHECKBOX: "checkbox",
  EMAIL: "email",
  FILE: "file",
  HIDDEN: "hidden",
  INPUT: "input",
  NUMBER: "number",
  PASSWORD: "password",
  RADIO: "radio",
  SELECT: "select",
  TEXTAREA: "textarea",
};

export const FileType: { [key: string]: string } = {
  AUDIO: "audio",
  IMAGE: "image",
  PDF: "pdf",
  VIDEO: "video",
};

export const FILE_TYPE_BY_EXT: { [key: string]: string } = {
  png: FileType.IMAGE,
  jpg: FileType.IMAGE,
  jpeg: FileType.IMAGE,
  gif: FileType.IMAGE,
  heic: FileType.IMAGE,
  heif: FileType.IMAGE,
  webp: FileType.IMAGE,
  bmp: FileType.IMAGE,
  mkv: FileType.VIDEO,
  mp4: FileType.VIDEO,
  webm: FileType.VIDEO,
  mp3: FileType.AUDIO,
  ogg: FileType.AUDIO,
  wav: FileType.AUDIO,
  pdf: FileType.PDF,
};

export const AUDIO_TYPES_BY_EXT: { [key: string]: string } = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

export const VIDEO_TYPES_BY_EXT: { [key: string]: string } = {
  mkv: "video/x-matroska",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

export const DEFAULT_DYNAMIC_STATE: DynamicFormElementsConfigType = {
  disables: {},
  loadings: {},
  sections: {},
};
