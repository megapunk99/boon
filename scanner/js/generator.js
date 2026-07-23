/**
 * 🌿 Boon Mobile Scanner — QR Code Generator Helper
 *
 * Generates QR codes for new biomedical waste items.
 * Uses the Boon backend API.
 */

/**
 * Generate a QR code for a waste item via the Boon backend.
 */
async function generateWasteQR(data) {
  if (!data.waste_type || !data.category || !data.source_facility) {
    throw new Error('Missing required fields: waste_type, category, source_facility');
  }

  const result = await generateQR({
    waste_type: data.waste_type,
    category: data.category,
    source_facility: data.source_facility,
    department: data.department || 'General',
    weight_kg: data.weight_kg || 1.0,
    container_type: data.container_type || 'bag',
    handler_name: data.handler_name || null,
  });

  return result;
}
