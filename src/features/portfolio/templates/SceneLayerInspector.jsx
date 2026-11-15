import React from 'react'
import {
  SCENE_BACKGROUNDS,SCENE_FONTS,sceneLayerIds,sceneLayerTitle,
  sceneLayerType
} from './sectionDesign'
import './scene-layer-inspector.css'

const number=(field,label,min,max,step=1)=>({field,label,min,max,step})
const fieldsPosition=[
  number('x','Trái (%)',0,100,.5),number('y','Trên (%)',0,100,.5),
  number('w','Rộng (%)',8,100,.5),number('h','Cao (%)',3,100,.5),
  number('rotation','Xoay (°)',-45,45,1),number('opacity','Độ đậm (%)',0,100,1)
]
function NumberControl({item,value,onChange}){
  return <label className="pt-layer-panel__number">{item.label}
    <input type="number" value={value??''} min={item.min} max={item.max}
      step={item.step} onChange={event=>onChange(item.field,Number(event.target.value))}/>
  </label>
}
export default function SceneLayerInspector({
  scene,section,selectedLayer,onSelectLayer,
  onPatchLayer,onPatchBackground,onAddNote,onRemoveNote,
  onPatchNote,onReset,onDisable,onChangeText,textForField
}){
  const ids=sceneLayerIds(section,scene)
  const ordered=[...ids].sort((a,b)=>scene.layers[b].z-scene.layers[a].z)
  const current=scene.layers[selectedLayer]||null
  const image=current&&sceneLayerType(selectedLayer)==='image'
  const noteId=selectedLayer.startsWith('note:')?selectedLayer.slice(5):null
  const note=noteId?scene.notes.find(n=>n.id===noteId):null
  return <div className="pt-layer-panel">
    <div className="pt-layer-panel__head">
      <div><strong>THIẾT KẾ TỪNG LỚP</strong><small>Chỉ áp dụng cho nghệ sĩ và khu vực đang chọn</small></div>
      <button type="button" onClick={onReset}>Đặt lại trang</button>
    </div>
    <label className="pt-layer-panel__background">Nền trang
      <select value={scene.background} onChange={event=>onPatchBackground(event.target.value)}>
        {SCENE_BACKGROUNDS.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}
      </select>
    </label>
    <div className="pt-layer-panel__layer-head">
      <strong>LAYER / THỨ TỰ HIỂN THỊ</strong>
      <button type="button" onClick={onAddNote} disabled={scene.notes.length>=8}>+ Chữ mới</button>
    </div>
    <div className="pt-layer-panel__layers">
      {ordered.map(layerId=>{
        const layer=scene.layers[layerId]
        return <button type="button" key={layerId}
          onClick={()=>onSelectLayer(layerId)}
          className={(selectedLayer===layerId?'is-active ':'')+(layer.hidden?'is-hidden':'')}>
          <span className="pt-layer-panel__kind">
            {sceneLayerType(layerId)==='image'?'▧':'T'}
          </span>
          <span>{sceneLayerTitle(layerId)}
            {layerId.startsWith('note:')&&<small>{scene.notes.find(n=>'note:'+n.id===layerId)?.text||''}</small>}
          </span>
          <em>z{layer.z}</em>
          <b>{layer.hidden?'◌':'◉'}</b>
        </button>
      })}
    </div>
    {current&&<div className="pt-layer-panel__properties" key={selectedLayer}>
      <div className="pt-layer-panel__properties-head">
        <strong>{sceneLayerTitle(selectedLayer)}</strong>
        <div className="pt-layer-panel__quick">
          <button type="button" title="Đưa ra trước" onClick={()=>onPatchLayer(selectedLayer,{z:current.z+1})}>↑</button>
          <button type="button" title="Đưa ra sau" onClick={()=>onPatchLayer(selectedLayer,{z:current.z-1})}>↓</button>
          <button type="button" onClick={()=>onPatchLayer(selectedLayer,{hidden:!current.hidden})}>
            {current.hidden?'Hiện':'Ẩn'}
          </button>
          {note&&<button type="button" className="is-danger"
            onClick={()=>onRemoveNote(noteId)}>Xóa</button>}
        </div>
      </div>
      {!image&&selectedLayer==='title'&&
        <label>Nội dung tiêu đề
          <textarea rows={2} value={textForField('title')}
            onChange={event=>onChangeText('title',event.target.value)}/>
        </label>}
      {!image&&['eyebrow','body'].includes(selectedLayer)&&
        <label>{selectedLayer==='body'?'Nội dung':'Nhãn phụ'}
          <textarea rows={3} value={textForField(selectedLayer)}
            onChange={event=>onChangeText(selectedLayer,event.target.value)}/>
        </label>}
      {note&&<label>Chữ trang trí
        <textarea rows={2} value={note.text} maxLength={280}
          onChange={event=>onPatchNote(noteId,event.target.value)}/>
      </label>}
      <div className="pt-layer-panel__numbers">
        {fieldsPosition.map(item=><NumberControl key={item.field} item={item}
          value={current[item.field]}
          onChange={(field,value)=>onPatchLayer(selectedLayer,{[field]:value})}/>)}
      </div>
      <label className="pt-layer-panel__range">Làm mờ layer ({current.blur}px)
        <input type="range" value={current.blur} min="0" max="24"
          onChange={event=>onPatchLayer(selectedLayer,{blur:Number(event.target.value)})}/>
      </label>
      {image?
        <div className="pt-layer-panel__numbers">
          <NumberControl item={number('radius','Bo góc (px)',0,50,1)}
            value={current.radius}
            onChange={(field,value)=>onPatchLayer(selectedLayer,{[field]:value})}/>
          <label>Hiển thị ảnh
            <select value={current.fit}
              onChange={event=>onPatchLayer(selectedLayer,{fit:event.target.value})}>
              <option value="cover">Phủ kín / crop</option>
              <option value="contain">Hiển thị toàn ảnh</option>
            </select>
          </label>
        </div>:
        <>
          <div className="pt-layer-panel__numbers">
            <NumberControl item={number('size','Cỡ chữ',9,240,.5)}
              value={current.size}
              onChange={(field,value)=>onPatchLayer(selectedLayer,{[field]:value})}/>
            <NumberControl item={number('spacing','Giãn chữ',-8,20,.5)}
              value={current.spacing}
              onChange={(field,value)=>onPatchLayer(selectedLayer,{[field]:value})}/>
            <NumberControl item={number('lineHeight','Giãn dòng',.7,3,.05)}
              value={current.lineHeight}
              onChange={(field,value)=>onPatchLayer(selectedLayer,{[field]:value})}/>
            <label>Độ đậm
              <select value={current.weight}
                onChange={event=>onPatchLayer(selectedLayer,{weight:Number(event.target.value)})}>
                {[400,500,600,700,800,900].map(w=><option key={w} value={w}>{w}</option>)}
              </select>
            </label>
          </div>
          <div className="pt-layer-panel__numbers">
            <label>Font
              <select value={current.font}
                onChange={event=>onPatchLayer(selectedLayer,{font:event.target.value})}>
                {SCENE_FONTS.map(font=><option value={font.id} key={font.id}>{font.label}</option>)}
              </select>
            </label>
            <label>Canh chữ
              <select value={current.align}
                onChange={event=>onPatchLayer(selectedLayer,{align:event.target.value})}>
                <option value="left">Trái</option>
                <option value="center">Giữa</option>
                <option value="right">Phải</option>
              </select>
            </label>
            <label>Màu chữ
              <input className="pt-layer-panel__color" type="color" value={current.color}
                onChange={event=>onPatchLayer(selectedLayer,{color:event.target.value})}/>
            </label>
          </div>
        </>}
      <p className="pt-layer-panel__help">
        Chọn layer trên bản xem trước để kéo thả. Kéo góc phải dưới để thay đổi kích thước.
        Các thuộc tính được lưu theo từng trang và không thay đổi Form chung.
      </p>
    </div>}
    {!current&&<p className="pt-layer-panel__help">
      Nhấn một layer trong danh sách hoặc chạm trực tiếp chữ và ảnh trên canvas để chỉnh.
    </p>}
    <button type="button" className="pt-layer-panel__disable" onClick={onDisable}>
      ↶ Trở về bố cục Form gốc cho trang này
    </button>
  </div>
}
