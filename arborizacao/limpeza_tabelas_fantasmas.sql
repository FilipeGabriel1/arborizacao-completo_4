-- =====================================================================
-- LIMPEZA — remove as tabelas fantasmas criadas pelo bug de mapeamento
-- =====================================================================
-- As entidades Java apontavam para nomes de tabela errados
-- (`area_pontos` e `arvore_fotos`, no singular) e o Hibernate, com
-- ddl-auto=update, criou essas tabelas extras sem apagar as corretas
-- (`areas_pontos` e `arvores_fotos`, no plural, com PK/FK adequadas).
--
-- Já corrigi as entidades no projeto para apontar para as tabelas
-- certas. Rode este script no banco para remover as tabelas erradas.
-- FAÇA BACKUP ANTES: mysqldump arborizacao > backup.sql
-- =====================================================================

USE `arborizacao`;

DROP TABLE IF EXISTS `area_pontos`;
DROP TABLE IF EXISTS `arvore_fotos`;
