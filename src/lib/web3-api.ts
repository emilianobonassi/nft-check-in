import axios from 'axios'
import { NftItem } from '@rarible/ethereum-api-client/build/models/NftItem'
import { NftItems } from '@rarible/ethereum-api-client/build/models/NftItems'
import PlaceholderImage from '../placeholder-image.png'
import INFT from './INFT'

const getAssets = async function (address: string, collections: string[], chainId: number): Promise<INFT[]> {
	const BASE_URI =
		chainId === 1 ? 'https://ethereum-api.rarible.org/v0.1' : 'https://ethereum-api-staging.rarible.org/v0.1'
	let continuation: string | undefined = undefined
	const results: NftItem[] = []
	do {
		let response = await axios(`${BASE_URI}/nft/items/byOwner?owner=${address}&continuation=${continuation ?? ''}`)
		let nftItems: NftItems = response.data
		results.push(...nftItems.items.filter(i => collections.includes(i.contract.toLowerCase())))
		continuation = nftItems.continuation
	} while (continuation !== undefined)
	return results.map(asset => toINFT(chainId, asset))
}

export function toINFT(chainId: number, asset: NftItem): INFT {
	const contractId = asset.contract.toLowerCase()
	const ownerId = asset.owners != null && asset.owners.length > 0 ? asset.owners[0].toLowerCase() : 'null'
	return {
		ownerId: ownerId,
		contractId: contractId,
		tokenId: asset.tokenId,
		name: asset.meta?.name!,
		collectionName: '',
		imgUrl: asset.meta?.image?.url.ORIGINAL ?? PlaceholderImage,
	}
}

export default getAssets
