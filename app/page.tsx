import { getChatGPTUser } from './chatgpt-auth';
import ControlCenter from './control-center';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await getChatGPTUser();

  return (
    <ControlCenter
      viewerEmail="info@flairo.org"
      viewerName="FLAIRO ADMIN"
    />
  );
}
