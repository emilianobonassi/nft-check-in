import { FC, useEffect, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useConnect, useDisconnect, useSignMessage, chain, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { utils } from 'ethers/lib'
import { ethers } from 'ethers'

import { WalletConnect } from './_app'
import getAssets from '@/lib/web3-api'
import INFT from '@/lib/INFT'
import { Card, CardMedia, CardContent, Link, Paper } from '@mui/material'

import { LooksOne, LooksTwo, Looks3, Looks4 } from '@mui/icons-material'
import { style } from '@mui/system'

import collectionsMap from '../collection.json'

const collections = Object.keys(collectionsMap)

const generateMessage = () => `Sign this message to check-in with your NFTs. ${new Date().toLocaleString()}`

const verifyMessage =
	provider =>
	async ({ address, message, signature }) => {
		let verified = false
		const bytecode = await provider.getCode(address)
		const isSmartContract = bytecode && utils.hexStripZeros(bytecode) !== '0x'
		try {
			if (isSmartContract) {
				const hash = utils.hashMessage(message)
				const smartWallet = new ethers.Contract(
					address,
					[
						'function isValidSignature(bytes32 _hash, bytes memory _signature) view returns (bytes4 magicValue)',
					],
					provider
				)

				const ret = await smartWallet.isValidSignature(hash, signature)
				verified = ret == '0x1626ba7e' // magic value
			} else {
				const recoveredAddress = utils.verifyMessage(message, signature)
				verified = address == recoveredAddress
			}
		} catch (e) {
			console.log(e)
		}

		return verified
	}

const Home: FC = () => {
	const { connectAsync } = useConnect({
		connector: WalletConnect,
	})
	const [user, setUser] = useState(null)
	const { disconnect } = useDisconnect()
	const defaultCollections = [collections[0]]
	const [selectedCollections, setSelectedCollections] = useState(defaultCollections)

	const { provider } = configureChains([chain.mainnet], [publicProvider()])

	const { signMessageAsync } = useSignMessage()

	useEffect(() => {
		disconnect()
	}, [disconnect])

	return (
		<>
			{!user ? (
				<Start
					connect={connectAsync}
					signMessage={signMessageAsync}
					verifyMessage={verifyMessage(provider({ chainId: chain.mainnet.id }))}
					setUser={setUser}
					defaultCollections={defaultCollections}
					selectedCollections={selectedCollections}
					setSelectedCollections={setSelectedCollections}
				/>
			) : (
				<Result
					user={user}
					disconnect={() => {
						disconnect()
						setUser(null)
					}}
					defaultCollections={defaultCollections}
					selectedCollections={selectedCollections}
					setSelectedCollections={setSelectedCollections}
				/>
			)}
			<Stack alignItems="center" justifyContent="center">
				<Typography variant="body2">
					Made with ❤️ by{' '}
					<Link href="https://twitter.com/rentableworld" target="_blank" rel="noopener noreferrer">
						{' '}
						Rentable{' '}
					</Link>
				</Typography>
			</Stack>
		</>
	)
}

const Start = ({
	defaultCollections,
	selectedCollections,
	setSelectedCollections,
	connect,
	signMessage,
	verifyMessage,
	setUser,
}) => {
	return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="90vh">
			<Stack>
				<Card elevation={0} sx={{ background: 'transparent' }}>
					<CardContent>
						<Stack alignItems="center" justifyContent="center" spacing={1}>
							<Typography variant="h2">🎉 ✅</Typography>
							<Typography variant="h3">NFT</Typography>
							<Typography variant="h3">CHECK-IN</Typography>
							<Autocomplete
								value={selectedCollections}
								multiple
								limitTags={2}
								sx={{ width: '100%' }}
								options={collections}
								getOptionLabel={option =>
									option.length > 22
										? option.substr(0, 4) + '...' + option.substr(option.length - 4)
										: option
								}
								defaultValue={defaultCollections}
								renderInput={params => (
									<TextField
										className="shadow rounded-lg bg-white dark:bg-gray-800"
										{...params}
										label="Collections"
										placeholder="collection name or address"
										sx={{
											'& label': { paddingLeft: theme => theme.spacing(2) },
											'& input': { paddingLeft: theme => theme.spacing(3.5) },
											'& fieldset': {
												paddingLeft: theme => theme.spacing(2.5),
												borderRadius: '30px',
											},
										}}
									/>
								)}
								freeSolo
								onChange={(a, b) => {
									if (b.length > 0) {
										const lastElement = b[b.length - 1]
										if (
											!collections.includes(lastElement) &&
											!/^0x[a-fA-F0-9]{40}$/.test(lastElement)
										) {
											b.pop()
										}
									}

									setSelectedCollections(b)
								}}
							/>
							<Button
								color="primary"
								variant="contained"
								onClick={async () => {
									const provider = await connect()
									const address = provider.account

									const message = generateMessage()

									const signature = await signMessage({
										message,
									})

									const verified = await verifyMessage({
										address,
										message,
										signature,
									})

									if (verified) {
										setUser(address)
									}
								}}
							>
								SCAN
							</Button>
							<Stack direction="column" spacing={1} alignItems="left" justifyContent="left" sx={{}}>
								<Typography>
									<b>Usage:</b>
								</Typography>

								<Stack
									direction="row"
									spacing={1}
									alignItems="left"
									justifyContent="left"
									sx={{ marginTop: 2 }}
								>
									<LooksOne />
									<Typography>Choose the collection(s) or enter the custom address </Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="left" justifyContent="left">
									<LooksTwo />
									<Typography>Click SCAN to show the QR</Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="left" justifyContent="left">
									<Looks3 />
									<Typography>
										Let your guests scan with their phone and verify their ownership
									</Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="left" justifyContent="left">
									<Looks4 />
									<Stack direction="row" spacing={1} alignItems="left" justifyContent="left">
										<Typography>Enjoy</Typography>
									</Stack>
								</Stack>
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	)
}

enum ResultState {
	LOADING = 0,
	VERIFIED,
	NOT_VERIFIED,
}

const Result = ({ user, defaultCollections, selectedCollections, setSelectedCollections, disconnect }) => {
	const [state, setState] = useState(ResultState.LOADING)
	const [asset, setAsset] = useState({} as INFT)

	useEffect(() => {
		async function fetchData() {
			const data: INFT[] = await getAssets(
				user,
				selectedCollections.map(i => (collections.includes(i) ? collectionsMap[i] : i).toLowerCase()),
				1
			)
			if (data.length == 0) {
				setState(ResultState.NOT_VERIFIED)
			} else {
				setAsset(data[0])
				setState(ResultState.VERIFIED)
			}
		}
		fetchData()
	}, [setState, selectedCollections, user])

	return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
			{' '}
			<Stack sx={{ width: '60%' }} alignItems="center" justifyContent="center" spacing={2}>
				{state === ResultState.VERIFIED && <Typography variant="h2">👍</Typography>}

				{state === ResultState.NOT_VERIFIED && <Typography variant="h2">⛔</Typography>}

				<Typography variant="h3" style={{ textAlign: 'center' }}>
					{state === ResultState.LOADING
						? 'LOADING...'
						: state === ResultState.VERIFIED
						? 'VERIFIED'
						: 'NOT VERIFIED'}
				</Typography>
				{state === ResultState.VERIFIED && (
					<>
						<Typography variant="h6">
							<b>Owner: </b>
							<Link href={'https://opensea.io/' + user} target="_blank" rel="noopener noreferrer">
								{user.substr(0, 4) + '...' + user.substr(user.length - 4)}
							</Link>
						</Typography>
						<Card elevation={5}>
							<CardMedia
								sx={{ objectFit: 'contain' }}
								component="img"
								src={`${asset.imgUrl}`}
								alt={`${asset.name}`}
							/>
							<CardContent>
								<Typography variant="h5" style={{ textAlign: 'center' }}>
									{asset.name}
								</Typography>
							</CardContent>
						</Card>
					</>
				)}

				{state === ResultState.NOT_VERIFIED && (
					<Typography variant="h6">
						<b>Owner: </b>
						<Link href={'https://opensea.io/' + user} target="_blank" rel="noopener noreferrer">
							{user.substr(0, 4) + '...' + user.substr(user.length - 4)}
						</Link>
					</Typography>
				)}

				<Button
					disabled={state === ResultState.LOADING}
					color="primary"
					variant="contained"
					onClick={() => {
						disconnect()
					}}
				>
					NEXT
				</Button>
			</Stack>
		</Box>
	)
}

export default Home
