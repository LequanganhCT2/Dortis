import {newStudioElement,resolveStudioLayout} from './studioModel.js'
import {photoMotionMode,photoMotionIntensity} from './photoMotionConfig.js'

export const NEW_IMAGE_APPEARANCE={radius:24,shadow:24,fit:'cover',photoMotion:'float',photoIntensity:45}

export async function inspectImageFile(file){
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||!file.size||file.size>25*1024*1024)
    throw new Error('Chỉ nhận JPG, PNG, WebP, AVIF từ 1 byte đến 25 MB.')
  const bitmap=await createImageBitmap(file)
  try{
    const width=bitmap.width,height=bitmap.height
    const canvas=document.createElement('canvas'),scale=Math.min(1,256/Math.max(width,height))
    canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale))
    const context=canvas.getContext('2d',{willReadFrequently:true})
    context.drawImage(bitmap,0,0,canvas.width,canvas.height)
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data
    let transparencyDetected=false
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]<255){transparencyDetected=true;break}
    return {width,height,orientation:width===height?'square':width>height?'landscape':'portrait',
      transparencyDetected,type:file.type,bytes:file.size}
  }finally{bitmap.close()}
}

export function newStyledImage(id,path,alt,appearance={},imageInfo){
  const item=newStudioElement('image',id,{path,alt,imageInfo})
  const style={...NEW_IMAGE_APPEARANCE,...appearance}
  style.photoMotion=photoMotionMode({motion:style.photoMotion})
  style.photoIntensity=photoMotionIntensity({motionIntensity:style.photoIntensity})
  for(const device of ['desktop','mobile'])
    item[device]=resolveStudioLayout({...item[device],...style},'image',device)
  return item
}
