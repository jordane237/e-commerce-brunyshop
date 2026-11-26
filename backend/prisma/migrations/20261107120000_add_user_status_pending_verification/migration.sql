-- AUT-01 : un nouveau compte est créé au statut PENDING_VERIFICATION.
-- La valeur manquait dans l'enum UserStatus : toute création de compte
-- échouait (invalid input value for enum "UserStatus").
--
-- PostgreSQL refuse d'utiliser une valeur d'enum dans la transaction qui
-- l'a créée : le DEFAULT est posé par la migration suivante.
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_VERIFICATION';
