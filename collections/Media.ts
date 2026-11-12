import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { altFromFilename } from '../lib/media-alt'

/** Uploads without alt text (e.g. through the API) get it from the file name. */
const defaultAlt: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.alt?.trim() && typeof data.filename === 'string') {
    data.alt = altFromFilename(data.filename)
  }
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [defaultAlt],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
      required: true,
      admin: {
        description:
          'Filled in from the file name when you choose a file. Edit it to describe what the image or video shows.',
        components: { Field: '/components/admin/AltField#AltField' },
      },
    },
    {
      name: 'imageName',
      type: 'text',
      label: 'Image name',
      maxLength: 80,
      admin: {
        description: 'Optional. Shown under the thumbnail in a product gallery, e.g. "Emerald".',
      },
    },
  ],
  upload: true,
}
