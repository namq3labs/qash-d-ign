// Demo mode: mock upload API hooks

export interface UploadResponseDto {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: string;
}

const noopMutation = () => ({
  mutateAsync: async (..._args: any[]) => ({
    url: "/default-avatar-icon.png",
    fileName: "demo.png",
    fileSize: 0,
    mimeType: "image/png",
    storagePath: "",
    uploadedAt: new Date().toISOString(),
  } as UploadResponseDto),
  mutate: () => {},
  isPending: false,
  isError: false,
});

export const useUploadCompanyLogo = noopMutation;
export const useUploadAvatar = noopMutation;
export const useUploadMultisigLogo = noopMutation;
