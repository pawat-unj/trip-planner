import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

export function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Trip Planner
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Create beautiful, shareable trip itineraries for backpacking, road trips, and day hikes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/edit">
              <Button size="lg">Create New Trip</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon="🗺️"
            title="Interactive Maps"
            description="Upload GPX files to display routes and elevation profiles automatically."
          />
          <FeatureCard
            icon="📋"
            title="Detailed Itineraries"
            description="Plan day-by-day activities, accommodations, and logistics."
          />
          <FeatureCard
            icon="🔗"
            title="Easy Sharing"
            description="Share trips via a simple URL. No login required."
          />
        </div>

        {/* Templates */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Choose Your Adventure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              icon="🎒"
              title="Backpacking"
              features={['Difficulty rating', 'Elevation profile', 'Multi-day itinerary', 'Packing checklist']}
            />
            <TemplateCard
              icon="🚗"
              title="Road Trip"
              features={['Transportation logistics', 'Multiple destinations', 'Accommodation tracking', 'Point-of-interest maps']}
            />
            <TemplateCard
              icon="🥾"
              title="Day Hike"
              features={['Trail difficulty', 'Elevation profile', 'Quick itinerary', 'Essential gear list']}
            />
          </div>
        </div>

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard number={1} title="Choose Template" description="Select backpacking, road trip, or day hike" />
            <StepCard number={2} title="Add Details" description="Fill in dates, locations, and activities" />
            <StepCard number={3} title="Upload GPX" description="Add your route and elevation data" />
            <StepCard number={4} title="Share" description="Export and share via GitHub Gist" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-text-muted">
          <p>Free and open source. No account required.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card hover>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </Card>
  );
}

function TemplateCard({ icon, title, features }: { icon: string; title: string; features: string[] }) {
  return (
    <Card>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="text-accent-sage">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-accent-sage/15 text-accent-forest flex items-center justify-center text-lg font-bold mx-auto mb-3">
        {number}
      </div>
      <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}
