ALTER TABLE `communities` ADD `recurring_programs` text DEFAULT '[]' NOT NULL;
UPDATE `communities` SET `recurring_programs` = '["Pest Share","Trash Valet"]' WHERE `id` = 'arbor' AND `recurring_programs` = '[]';
UPDATE `communities` SET `recurring_programs` = '["Valet Parking","Pest Share"]' WHERE `id` = 'solara' AND `recurring_programs` = '[]';
UPDATE `communities` SET `recurring_programs` = '["Pest Share","Package Lockers"]' WHERE `id` = 'sawgrass' AND `recurring_programs` = '[]';
