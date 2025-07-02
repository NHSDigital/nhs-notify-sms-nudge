export function tidToTemplateS3Key(tid: string) {
  return `templates/${tid}/${tid}_template.json`;
}

export function tidToImageS3Key(tid: string, fileName: string) {
  return `templates/${tid}/images/${fileName}`;
}
