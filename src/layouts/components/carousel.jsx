import * as React from "react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "/src/layouts/components/ui/carousel"

export function PhotoGrid({images}) {
  return (
    <Carousel className="max-w-[80vw] m-auto"
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem className="h-[80vh] flex items-center justify-center" key={index}>
              <img className="h-full" src={image} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
