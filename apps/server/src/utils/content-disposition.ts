export function contentDisposition(filename: string): string {
	const encoded = encodeURIComponent(filename)
	return `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`
}