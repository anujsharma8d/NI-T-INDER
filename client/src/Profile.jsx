import PageLayout from "./children/modules/layout/PageLayout";
import ProfileOptions from "./children/modules/functional/ProfilePage/ProfileOptions";

export default function Profile({onLogout}) {
  return (
    <PageLayout>
      <ProfileOptions onLogout={onLogout} />
    </PageLayout>
  )
}