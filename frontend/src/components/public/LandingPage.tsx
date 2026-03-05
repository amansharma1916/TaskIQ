import BackgroundEffects from './Landing_Page/BackgroundEffects'
import CTASection from './Landing_Page/CTASection'
import DashboardPreview from './Landing_Page/DashboardPreview'
import Features from './Landing_Page/Features'
import Footer from './Landing_Page/Footer'
import Hero from './Landing_Page/Hero'
import HowItWorks from './Landing_Page/HowItWorks'
import Navbar from './Landing_Page/Navbar'
import Pricing from './Landing_Page/Pricing'
import TrustBar from './Landing_Page/TrustBar'
import '../../styles/landing-page.css'

const LandingPage = () => {
	return (
		<>
			<BackgroundEffects />
			<Navbar />
			<main>
				<Hero />
				<TrustBar />
				<DashboardPreview />
				<Features />
				<HowItWorks />
				<Pricing />
				<CTASection />
			</main>
			<Footer />
		</>
	)
}

export default LandingPage

