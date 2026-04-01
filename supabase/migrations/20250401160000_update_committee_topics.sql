-- Migration: Update Committee Topics for BILLMUN 2026
-- Created: April 1, 2026

-- Update committees with their respective topics
UPDATE committees 
SET topic = 'The San José Galleon Dispute: Who owns "abandoned" gold in international waters?',
    description = 'The International Court of Justice (ICJ) addresses the complex legal dispute over the San José Galleon shipwreck and its treasure. Delegates will examine international maritime law, sovereignty rights, and the ethical implications of claiming historical artifacts found in international waters.',
    updated_at = NOW()
WHERE abbreviation = 'ICJ';

UPDATE committees 
SET topic = 'Regulating the Global Gig Economy and Cross-Border Digital Labor',
    description = 'The Economic and Social Council (ECOSOC) convenes to address the rapid growth of the gig economy and digital labor platforms. Delegates will discuss worker protections, cross-border labor regulations, platform accountability, and establishing international standards for digital employment in an increasingly interconnected world.',
    updated_at = NOW()
WHERE abbreviation = 'ECOSOC';

UPDATE committees 
SET topic = 'Should Wayne Enterprises be permitted to deploy city-wide sonar surveillance technology to track high-level threats?',
    description = 'In this SPECIAL committee, delegates step into the Batman universe to debate the Nightfall Protocol. The question at hand: Should Wayne Enterprises be allowed to deploy mass surveillance technology across Gotham City to combat terrorism? Delegates must balance security imperatives against privacy rights and civil liberties in this high-stakes security council scenario.',
    updated_at = NOW()
WHERE abbreviation = 'SPECIAL' OR name ILIKE '%Batman%' OR name ILIKE '%Nightfall%';

UPDATE committees 
SET topic = 'Civilian Aviation Under Fire: Addressing the Risks of Armed Conflict Airspaces',
    description = 'The United Nations Security Council (UNSC) addresses the growing dangers to civilian aircraft operating near or through conflict zones. Delegates will examine international aviation security protocols, state responsibilities, and collaborative measures to protect innocent passengers while respecting national sovereignty.',
    updated_at = NOW()
WHERE abbreviation = 'UNSC';

UPDATE committees 
SET topic = 'The Ethics of the Macabre: Regulating "Dark Tourism" at Sites of Atrocity and Human Suffering',
    description = 'UNESCO confronts the phenomenon of "dark tourism" - the visitation of sites associated with tragedy, atrocity, and human suffering. Delegates will debate the ethical boundaries of tourism at historical atrocity sites, balancing educational value, remembrance, economic development, and respect for victims and their descendants.',
    updated_at = NOW()
WHERE abbreviation = 'UNESCO';

UPDATE committees 
SET topic = 'The Vienna Congress (1814): Redrawing the Map of Europe and restoring the balance of power',
    description = 'The Historical Committee transports delegates to 1814, where European powers gather in Vienna to reshape the continent after the Napoleonic Wars. Delegates will negotiate territorial boundaries, establish new political orders, and attempt to create a sustainable balance of power that prevents future large-scale conflicts.',
    updated_at = NOW()
WHERE abbreviation = 'UNHC' OR name ILIKE '%Historical%';

UPDATE committees 
SET topic = 'Additive Manufacturing and Illicit Arms Trafficking: Establishing International Standards for the Regulation and Traceability of 3D-Printed Firearms',
    description = 'The Disarmament and International Security Committee (DISEC) addresses the emerging threat of 3D-printed firearms and additive manufacturing technologies. Delegates will develop international frameworks for regulating these technologies, preventing illicit arms trafficking, and establishing traceability standards while respecting technological innovation rights.',
    updated_at = NOW()
WHERE abbreviation = 'DISEC';

-- Insert any missing committees
INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'International Court of Justice', 'ICJ', 
       'The San José Galleon Dispute: Who owns "abandoned" gold in international waters?',
       'The International Court of Justice (ICJ) addresses the complex legal dispute over the San José Galleon shipwreck and its treasure. Delegates will examine international maritime law, sovereignty rights, and the ethical implications of claiming historical artifacts found in international waters.',
       true, 15, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'ICJ');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'Economic and Social Council', 'ECOSOC',
       'Regulating the Global Gig Economy and Cross-Border Digital Labor',
       'The Economic and Social Council (ECOSOC) convenes to address the rapid growth of the gig economy and digital labor platforms. Delegates will discuss worker protections, cross-border labor regulations, platform accountability, and establishing international standards for digital employment.',
       true, 40, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'ECOSOC');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'Special Committee - Batman Protocol', 'SPECIAL',
       'Should Wayne Enterprises be permitted to deploy city-wide sonar surveillance technology to track high-level threats?',
       'In this SPECIAL committee, delegates step into the Batman universe to debate the Nightfall Protocol. Should Wayne Enterprises be allowed to deploy mass surveillance technology across Gotham City to combat terrorism?',
       true, 20, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'SPECIAL');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'United Nations Security Council', 'UNSC',
       'Civilian Aviation Under Fire: Addressing the Risks of Armed Conflict Airspaces',
       'The United Nations Security Council (UNSC) addresses the growing dangers to civilian aircraft operating near or through conflict zones. Delegates will examine international aviation security protocols and collaborative measures to protect innocent passengers.',
       true, 15, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'UNSC');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'UNESCO', 'UNESCO',
       'The Ethics of the Macabre: Regulating "Dark Tourism" at Sites of Atrocity and Human Suffering',
       'UNESCO confronts the phenomenon of "dark tourism" - the visitation of sites associated with tragedy, atrocity, and human suffering. Delegates will debate the ethical boundaries and balance educational value with respect for victims.',
       true, 30, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'UNESCO');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'Historical Committee - 19th Century', 'UNHC',
       'The Vienna Congress (1814): Redrawing the Map of Europe and restoring the balance of power',
       'The Historical Committee transports delegates to 1814, where European powers gather in Vienna to reshape the continent after the Napoleonic Wars. Delegates will negotiate territorial boundaries and establish a sustainable balance of power.',
       true, 25, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'UNHC');

INSERT INTO committees (name, abbreviation, topic, description, is_active, max_delegates, created_at)
SELECT 'Disarmament and International Security Committee', 'DISEC',
       'Additive Manufacturing and Illicit Arms Trafficking: Establishing International Standards for the Regulation and Traceability of 3D-Printed Firearms',
       'The Disarmament and International Security Committee (DISEC) addresses the emerging threat of 3D-printed firearms and additive manufacturing technologies. Delegates will develop international frameworks for regulating these technologies.',
       true, 35, NOW()
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE abbreviation = 'DISEC');
