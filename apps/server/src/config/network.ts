export function getYtDlpProxy(): string | undefined {
	return Bun.env.YTDLP_PROXY || Bun.env.HTTPS_PROXY || Bun.env.HTTP_PROXY || undefined
}

export function shouldForceIpv4(): boolean {
	return Bun.env.YTDLP_FORCE_IPV4 !== 'false'
}

export function getYtDlpNetworkArgs(): string[] {
	const proxy = getYtDlpProxy()
	const args: string[] = []

	if (shouldForceIpv4()) {
		args.push('--force-ipv4')
	}

	if (proxy) {
		args.push('--proxy', proxy)
	}

	return args
}
