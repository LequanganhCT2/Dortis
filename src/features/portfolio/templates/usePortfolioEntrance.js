import {useEffect,useState} from 'react'

export default function usePortfolioEntrance(urls,enabled){
  const key=enabled?JSON.stringify([...new Set(Object.values(urls||{}))].sort()):''
  const [state,setState]=useState({key:'',ready:false,done:0,total:0,failed:0})
  const [retry,setRetry]=useState(0)
  useEffect(()=>{
    if(!enabled)return
    let active=true,done=0,failed=0
    const sources=JSON.parse(key),images=[],timers=[]
    setState({key,ready:false,done:0,total:sources.length,failed:0})
    const jobs=sources.map(src=>new Promise(resolve=>{
      const image=new Image();images.push(image)
      let finished=false
      const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);done++;if(!ok)failed++
        if(active)setState({key,ready:false,done,total:sources.length,failed});resolve()}
      const timer=setTimeout(()=>finish(false),30000);timers.push(timer)
      image.onload=()=>image.decode().then(()=>finish(true),()=>finish(false))
      image.onerror=()=>finish(false)
      image.src=src
    }))
    Promise.all([...jobs,document.fonts?.ready]).then(()=>{
      if(active)setState({key,ready:failed===0,done,total:sources.length,failed})
    })
    return()=>{active=false;timers.forEach(clearTimeout);images.forEach(image=>{image.onload=null;image.onerror=null})}
  },[key,enabled,retry])
  return {...state,ready:enabled&&state.key===key&&state.ready,retry:()=>setRetry(n=>n+1)}
}
