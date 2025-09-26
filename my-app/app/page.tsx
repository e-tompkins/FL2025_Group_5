import Image from "next/image";
import FileUpload from "./components/file_upload";
import { getUserSession } from "@/lib/session";
import { FILE } from "dns";

export default async function Home() {
  const session = await getUserSession();
  return (
    <>
      <div className="session">
        <main className="">{JSON.stringify(session)}</main>
      </div>
      <FileUpload/>
    </>
  );
}
