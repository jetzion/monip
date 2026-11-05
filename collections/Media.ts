import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
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
