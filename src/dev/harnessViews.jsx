// DEVELOPMENT ONLY: sample screens for visual checks (see harness.jsx).
import { useState } from "react";
import AppBar from "../components/AppBar";
import CropPicker from "../features/fields/components/CropPicker";
import SafetyCard from "../features/fields/components/SafetyCard";
import PostCard from "../features/fields/components/PostCard";
import PhotoPicker from "../components/PhotoPicker";
import VoicePlayer from "../components/VoicePlayer";
import { mergeCrops, mergeSettings } from "../features/fields/cropGuides.logic";
import { KIND, PRICE, STATUS } from "../features/fields/fields.logic";

const crops = mergeCrops();
const settings = mergeSettings();
const hoursAgo = (h) => Date.now() - h * 3600e3;
const PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='#c9b77a'/><path d='M0 90 Q60 60 120 90 V120 H0Z' fill='#806b2e'/></svg>");

export const samplePosts = [
  { id: "r1", kind: KIND.RESIDUE, crop: "cotton", acres: 3, village: "Ponnur", district: "Guntur", priceType: PRICE.PER_DAY, amount: 500, negotiable: true, status: STATUS.AVAILABLE, allowNightStay: true, lastSprayDate: null, photos: [{ url: PHOTO }], _dist: 2.4 },
  { id: "r2", kind: KIND.RESIDUE, crop: "jowar", acres: 5, village: "Tenali", district: "Guntur", priceType: PRICE.FREE_FOR_MANURE, status: STATUS.PARTLY, notSprayed: true, photos: [], _dist: 7.9 },
  { id: "n1", kind: KIND.NIGHT_STAY_NEED, acres: 2, village: "Mangalagiri", district: "Guntur", priceType: PRICE.PER_NIGHT, amount: 800, status: STATUS.AVAILABLE, photos: [], _dist: 4.1 },
  { id: "h1", kind: KIND.HERD, animalType: "sheep", animalCount: 300, village: "Narasaraopet", district: "Palnadu", priceType: PRICE.PER_NIGHT, amount: 1000, status: STATUS.AVAILABLE, locationUpdatedAt: hoursAgo(3), photos: [], _dist: 3.0 },
];

function CropPickerView() {
  const [v, setV] = useState("cotton");
  return (
    <div className="app-shell"><AppBar variant="detail" title="Crop" onBack={() => {}} />
      <div className="content"><CropPicker crops={crops} settings={settings} value={v} onChange={setV} /></div></div>
  );
}

function PhotoPickerView() {
  const [items, setItems] = useState([{ key: "a", url: PHOTO }, { key: "b", url: PHOTO }]);
  return <div className="app-shell"><div className="content"><PhotoPicker items={items} onChange={setItems} /></div></div>;
}

export const views = {
  appbar: () => (
    <>
      <AppBar variant="top" title="Good morning, Rama" subtitle="JeevaMitra" onMap={() => {}} onBell={() => {}} unread />
      <div style={{ height: 16 }} />
      <AppBar variant="detail" title="Post land" onBack={() => {}} />
    </>
  ),
  cropPicker: CropPickerView,
  safetyCotton: () => (
    <div className="app-shell"><div className="content"><SafetyCard crop={crops.find((c) => c.id === "cotton")} settings={settings} /></div></div>
  ),
  postCards: () => (
    <div className="app-shell"><div className="content">{samplePosts.map((p) => <PostCard key={p.id} post={p} crops={crops} settings={settings} />)}</div></div>
  ),
  photoPicker: PhotoPickerView,
  voicePlayer: () => (
    <div className="app-shell"><div className="content"><VoicePlayer src="" durationSec={84} /></div></div>
  ),
};
