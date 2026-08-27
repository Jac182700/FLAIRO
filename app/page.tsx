import { getChatGPTUser } from './chatgpt-auth';
import ControlCenter from './control-center';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();

  return (
    <ControlCenter
      viewerEmail={user?.email ?? 'local-preview@flairo.internal'}
      viewerName={user?.displayName ?? 'FLAIRO employee'}
    />
  );
}
