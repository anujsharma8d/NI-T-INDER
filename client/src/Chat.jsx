import PageLayout from "./children/modules/layout/PageLayout";
import ViewAllMatches from "./children/modules/functional/Matches/ViewAllMatches";
import MatchCard from "./children/modules/functional/Matches/MatchCard";
import ChatPage from "./children/modules/functional/Matches/ChatPage";

export default function Chat() {
  return (
    <PageLayout>
      <ViewAllMatches MatchCard={MatchCard} ChatPage={ChatPage} />
    </PageLayout>
  )
} 