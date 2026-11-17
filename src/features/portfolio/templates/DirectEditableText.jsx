import React,{useLayoutEffect,useRef,useState} from 'react'
import CharacterBurst from './CharacterBurst'

/** Inline text editing on the exact published layer, without changing its
 * geometry, font, drag position or profile/PDF source. Textarea is active only
 * for a signed-in admin in the published page's Edit mode. */
export default function DirectEditableText({
  text='',displayText,active=false,mode='letters',maxCharacters=160,disabled=false,
  kind='title',onChange,onFinish
}){
  const source=String(text??'')
  const [draft,setDraft]=useState(source)
  const ref=useRef(null),lastActive=useRef(false)
  useLayoutEffect(()=>{
    if(active&&!lastActive.current){
      setDraft(source)
      const input=ref.current
      if(input){
        input.focus({preventScroll:true})
        input.setSelectionRange(input.value.length,input.value.length)
      }
    }
    lastActive.current=active
  },[active,source])
  useLayoutEffect(()=>{
    if(!active||!ref.current)return
    const input=ref.current
    input.style.height='1px'
    input.style.height=Math.min(800,Math.max(32,input.scrollHeight+2))+'px'
  },[active,draft])
  if(!active)return <CharacterBurst text={displayText===undefined?source:displayText} disabled={disabled}
    mode={mode} maxCharacters={maxCharacters}/>
  return <textarea ref={ref} className="pt-direct-text-input"
    data-pt-inline-text-editor="" aria-label={'Sửa nội dung '+kind}
    title="Nhập chữ trực tiếp · Nhấn Ctrl+Enter hoặc nhấp ra ngoài để hoàn tất"
    spellCheck value={draft} rows={1} maxLength={kind.startsWith('note:')?280:10000}
    placeholder="Nhập nội dung tại đây…"
    onChange={event=>{
      const next=event.currentTarget.value
      setDraft(next)
      onChange?.(next)
    }}
    onPointerDown={event=>event.stopPropagation()}
    onPointerMove={event=>event.stopPropagation()}
    onPointerUp={event=>event.stopPropagation()}
    onDoubleClick={event=>event.stopPropagation()}
    onClick={event=>event.stopPropagation()}
    onBlur={()=>onFinish?.()}
    onKeyDown={event=>{
      event.stopPropagation()
      if(event.key==='Escape'||(event.key==='Enter'&&(event.ctrlKey||event.metaKey||
        (kind!=='body'&&!kind.startsWith('note:')&&!event.shiftKey)))){
        event.preventDefault()
        event.currentTarget.blur()
      }
    }}/>
}
