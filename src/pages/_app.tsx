import Head from 'next/head'
import '@rainbow-me/rainbowkit/styles.css'
import { chain, createClient, WagmiConfig } from 'wagmi'
import { apiProvider, configureChains, getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, provider } = configureChains(
	[chain.optimism],
	[apiProvider.infura(process.env.NEXT_PUBLIC_INFURA_ID), apiProvider.fallback()]
)

export const WalletConnect = new WalletConnectConnector({
	options: {
		qrcode: true,
		qrcodeModalOptions: {
			desktopLinks: [],
			mobileLinks: [],
		},
	},
})

const wagmiClient = createClient({ autoConnect: false, connectors: [WalletConnect], provider })

const App = ({ Component, pageProps }) => {
	return (
		<>
			<Head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta
					name="viewport"
					content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
				/>
				<meta name="description" content="Description" />
				<meta name="keywords" content="Keywords" />
				<link rel="manifest" href="/manifest.json" />
				<link href="/favicon.ico" rel="icon" type="image/png" sizes="48x48" />
				<link rel="apple-touch-icon" href="/favicon.ico"></link>
				<meta name="theme-color" content="#000000" />
				<title>NFT Check-In</title>
			</Head>
			<WagmiConfig client={wagmiClient}>
				<RainbowKitProvider chains={chains}>
					<Component {...pageProps} />
				</RainbowKitProvider>
			</WagmiConfig>
		</>
	)
}

export default App
