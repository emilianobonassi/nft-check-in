import { StaticImageData } from 'next/image'

export default interface INFT {
	ownerId: string
	contractId: string
	tokenId: string
	name: string
	collectionName: string
	imgUrl: string | StaticImageData
}
