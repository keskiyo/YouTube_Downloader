import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
			<div className='min-h-screen bg-bg-primary app-shell flex flex-col'>
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
			<ToastContainer
				position='top-center'
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme='colored'
				limit={4}
			/>
		</BrowserRouter>
	)
}
