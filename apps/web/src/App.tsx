import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SitesPage from './app/(route)/(all-sites)/sites/page'
import { SitePage } from './app/(route)/(site)/site/[name]/page'
import MainPage from './app/(route)/page'
import { Footer } from './components/Footer/Footer'
import { Header } from './components/Header/Header'
import { ScrollToTop } from './components/OtherComponents/ScrollToTop'

export function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<div className='min-h-screen bg-bg-primary flex flex-col'>
				<Header />

				{/* Основной контент меняется в зависимости от URL */}
				<main className='grow'>
					<Routes>
						<Route path='/' element={<MainPage />} />
						<Route path='/sites' element={<SitesPage />} />
						<Route path='/site/:name' element={<SitePage />} />
					</Routes>
				</main>
				<Footer />
			</div>
		</BrowserRouter>
	)
}
