function PreloadImages(images: string[], onImagesLoaded?: (loadedImages: string[]) => void): Promise<string[]> {
  return new Promise((resolve) => {
    const loaded: string[] = []
    for (const imageUrl of images) {
      const image = new Image()
      image.src = imageUrl
      image.onload = () => {
        loaded.push(imageUrl)
        if (loaded.length === images.length) {
          onImagesLoaded && onImagesLoaded(loaded)
          resolve(loaded)
        }
      }
    }
  })
}

export {
  PreloadImages,
}
