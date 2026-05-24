import StandardPlayer from "../../standard/2024.latest/player.js";
import { rgb } from "../../../../scripts/lib/pdf-lib.esm.js";

class FeaturesPlayerMapping extends StandardPlayer {

    authors = [
        {
            name: 'gioppoluca',
            url: 'https://github.com/gioppoluca',
            github: 'https://github.com/gioppoluca',
        },
    ];

    // Fill all standard fields, blank the features boxes (covered by overflow pages),
    // and repurpose two of them for consumables and loot.
    async createMappings() {
        await super.createMappings();
        this.setCalculated("CLASS FEATURES 2", "");
        this.setCalculated("SPECIES TRAITS", "");

        const consumables = this.actor.items
            .filter(i => i.type === 'consumable')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(i => i.system?.quantity > 1 ? `${i.name} ×${i.system.quantity}` : i.name)
            .join('\n');
        this.setCalculated("CLASS FEATURES 1", consumables);

        const loot = this.actor.items
            .filter(i => ['loot', 'backpack'].includes(i.type))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(i => i.system?.quantity > 1 ? `${i.name} ×${i.system.quantity}` : i.name)
            .join('\n');
        this.setCalculated("FEATS", loot);
    }

    // Append full-page features & traits after the character sheet.
    // All feature types are included and will overflow to as many pages as needed.
    async addCardPages(pdfDoc) {
        const fontUrl = foundry.utils.getRoute("/modules/sheet-export-mw/mappings/dnd5e/Roboto-Regular.ttf");
        const fontBuffer = await fetch(fontUrl).then(r => r.arrayBuffer());
        const font = await pdfDoc.embedFont(fontBuffer);

        let allText = "";

        const classFeatures = this.actor.items
            .filter(i => i.type === 'feat' && i.system?.type?.value === 'class')
            .sort((a, b) => a.name.localeCompare(b.name));

        if (classFeatures.length > 0) {
            allText += "=== Class Features ===\n\n";
            for (const feat of classFeatures) {
                allText += `### ${feat.name}`;
                if (feat.system?.source?.label) allText += ` (${feat.system.source.label})`;
                allText += ` ###\n`;
                if (feat.system?.description?.value) {
                    allText += await this.htmlToText(feat.system.description.value);
                    allText += "\n";
                }
            }
        }

        const speciesTraits = this.actor.items
            .filter(i => i.type === 'feat' && i.system?.type?.value === 'race')
            .sort((a, b) => a.name.localeCompare(b.name));

        if (speciesTraits.length > 0) {
            if (allText) allText += "\n";
            allText += "=== Species Traits ===\n\n";
            for (const trait of speciesTraits) {
                allText += `### ${trait.name}`;
                if (trait.system?.source?.label) allText += ` (${trait.system.source.label})`;
                allText += ` ###\n`;
                if (trait.system?.description?.value) {
                    allText += await this.htmlToText(trait.system.description.value);
                    allText += "\n";
                }
            }
        }

        const feats = this.actor.items
            .filter(i => ['feat', 'trait'].includes(i.type) &&
                i.system?.type?.value !== 'class' &&
                i.system?.type?.value !== 'race');

        if (feats.length > 0) {
            if (allText) allText += "\n";
            allText += "=== Feats & Traits ===\n\n";
            for (const feat of feats) {
                allText += `### ${feat.name}`;
                if (feat.system?.source?.label) allText += ` (${feat.system.source.label})`;
                allText += ` ###\n`;
                if (feat.system?.description?.value) {
                    allText += await this.htmlToText(feat.system.description.value);
                    allText += "\n";
                }
            }
        }

        const EQUIPMENT_TYPES = new Set(['weapon', 'equipment', 'consumable', 'tool', 'loot']);
        const equipWithEffects = this.actor.items
            .filter(i => EQUIPMENT_TYPES.has(i.type) && i.system?.description?.value?.trim())
            .sort((a, b) => a.name.localeCompare(b.name));

        if (equipWithEffects.length > 0) {
            if (allText) allText += "\n";
            allText += "=== Equipment with Effects ===\n\n";
            for (const item of equipWithEffects) {
                allText += `### ${item.name} ###\n`;
                allText += await this.htmlToText(item.system.description.value);
                allText += "\n";
            }
        }

        await this.addTextFlowPages(pdfDoc, allText, {
            font,
            size: 9,
            titleSize: 14,
            lineHeight: 1.4,
            title: `${this.actor.name} — Features & Traits`,
            subtitle: `${this.actor.name} — Features & Traits`,
            color: rgb(0.1, 0.1, 0.1),
            titleColor: rgb(0.45, 0.1, 0.1),
        });
    }
}

export default FeaturesPlayerMapping;
