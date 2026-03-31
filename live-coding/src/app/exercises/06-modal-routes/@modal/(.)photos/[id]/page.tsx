import { getPhoto } from "@/lib/data";
import { PhotoModal } from "../../../photo-modal";
import { notFound } from "next/navigation";

export default async function InterceptedPhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = getPhoto(id);
  if (!photo) notFound();

  return <PhotoModal photo={photo} />;
}
