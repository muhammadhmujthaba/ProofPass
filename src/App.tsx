import { useState, useEffect } from 'react';
import { Shell, type View } from './components/Shell';
import { useStore } from './store';
import { HomeScreen } from './screens/Home';
import { JourneyScreen } from './screens/Journey';
import { ProofLensScreen } from './screens/ProofLens';
import { SavedScreen } from './screens/Saved';
import { HousingScreen } from './screens/Housing';
import { ProofKeyScreen } from './screens/ProofKey';
import { ReceiptScreen } from './screens/Receipt';
import { ActivityScreen } from './screens/Activity';
import { SettingsScreen } from './screens/Settings';

function App() {
  const [view, setView] = useState<View>('home');
  const hasJourney = useStore((s) => Boolean(s.journeys.housing_registration));

  // If journey completed, redirect housing/proofkey to receipt when reopening
  const journeyComplete = useStore((s) => Boolean(s.journeys.housing_registration?.receiptId));

  function navigate(v: View) {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Gate: journey-only views need an active journey
  const journeyViews: View[] = ['journey', 'prooflens', 'housing', 'proofkey'];
  const gatedView = journeyViews.includes(view) && !hasJourney ? 'home' : view;

  useEffect(() => {
    if (journeyComplete && (view === 'housing' || view === 'proofkey')) {
      // allow viewing but keep as is; screens handle completed state
    }
  }, [journeyComplete, view]);

  let content: React.ReactNode;
  switch (gatedView) {
    case 'home':
      content = <HomeScreen onNavigate={navigate} />;
      break;
    case 'journey':
      content = <JourneyScreen onNavigate={navigate} />;
      break;
    case 'prooflens':
      content = <ProofLensScreen onNavigate={navigate} />;
      break;
    case 'saved':
      content = <SavedScreen />;
      break;
    case 'housing':
      content = <HousingScreen onNavigate={navigate} />;
      break;
    case 'proofkey':
      content = <ProofKeyScreen onNavigate={navigate} />;
      break;
    case 'receipt':
      content = <ReceiptScreen onNavigate={navigate} />;
      break;
    case 'activity':
      content = <ActivityScreen />;
      break;
    case 'settings':
      content = <SettingsScreen />;
      break;
    default:
      content = <HomeScreen onNavigate={navigate} />;
  }

  return (
    <Shell view={gatedView} onNavigate={navigate}>
      {content}
    </Shell>
  );
}

export default App;
