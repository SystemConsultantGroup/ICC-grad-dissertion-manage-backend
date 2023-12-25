export const convertFileUrl = (fileKey: string): string => {
  return `https://${process.env.MINIO_END_POINT}/${process.env.MINIO_BUCKET_NAME}/${fileKey}`;
};
