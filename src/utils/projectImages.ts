// Project Preset Images & Helpers for Project Cover Photos
import bungalowThumb from '../assets/images/bungalow_project_thumb_1790509991341.jpg';
import duplexThumb from '../assets/images/luxury_duplex_thumb_1790516776093.jpg';
import hostelThumb from '../assets/images/hostel_building_thumb_1790509978576.jpg';
import commercialThumb from '../assets/images/commercial_office_thumb_1790516762276.jpg';
import clinicThumb from '../assets/images/community_clinic_thumb_1790510005065.jpg';
import constructionHero from '../assets/images/construction_hero_crane_1790509965704.jpg';

export interface ProjectImagePreset {
  id: string;
  name: string;
  type: string;
  url: string;
}

export const PROJECT_IMAGE_PRESETS: ProjectImagePreset[] = [
  {
    id: 'bungalow',
    name: '3-Bed Bungalow',
    type: 'Residential',
    url: bungalowThumb,
  },
  {
    id: 'duplex',
    name: 'Contemporary Duplex',
    type: 'Residential',
    url: duplexThumb,
  },
  {
    id: 'hostel',
    name: '2-Storey Hostel Block',
    type: 'Building',
    url: hostelThumb,
  },
  {
    id: 'commercial',
    name: 'Commercial Office',
    type: 'Commercial',
    url: commercialThumb,
  },
  {
    id: 'clinic',
    name: 'Community Health Clinic',
    type: 'Healthcare',
    url: clinicThumb,
  },
  {
    id: 'construction',
    name: 'Site Framing & Crane',
    type: 'Industrial / Frame',
    url: constructionHero,
  },
];

/**
 * Reads an uploaded image file and returns a compressed data URL suitable for storing with the project.
 */
export async function fileToDataUrl(file: File, maxWidth = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(readerEvent.target?.result as string);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get fallback project image based on project type or index
 */
export function getProjectCoverImage(project?: { image_url?: string; thumbnail_url?: string; project_type?: string } | null, fallbackIndex = 0): string {
  if (project?.image_url) return project.image_url;
  if (project?.thumbnail_url) return project.thumbnail_url;

  const type = (project?.project_type || '').toLowerCase();
  if (type.includes('bungalow')) return PROJECT_IMAGE_PRESETS[0].url;
  if (type.includes('duplex') || type.includes('residential')) return PROJECT_IMAGE_PRESETS[1].url;
  if (type.includes('hostel') || type.includes('school')) return PROJECT_IMAGE_PRESETS[2].url;
  if (type.includes('commercial') || type.includes('office')) return PROJECT_IMAGE_PRESETS[3].url;
  if (type.includes('health') || type.includes('clinic') || type.includes('hospital')) return PROJECT_IMAGE_PRESETS[4].url;
  
  return PROJECT_IMAGE_PRESETS[fallbackIndex % PROJECT_IMAGE_PRESETS.length].url;
}
