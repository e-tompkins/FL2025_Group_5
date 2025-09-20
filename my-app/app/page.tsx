import Image from "next/image";
import { getUserSession } from '@/lib/session';

export default async function Home() {
  const session = await getUserSession();
  return <main className="">{JSON.stringify(session)}</main>;
}
