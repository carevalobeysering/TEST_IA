BEGIN TRY

BEGIN TRAN;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'Purchase_patientId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[Purchase] DROP CONSTRAINT [Purchase_patientId_fkey];
END;

IF OBJECT_ID(N'[dbo].[ProgramStatus]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'ProgramStatus_patientId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[ProgramStatus] DROP CONSTRAINT [ProgramStatus_patientId_fkey];
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'Purchase_patientId_purchaseDate_idx'
      AND object_id = OBJECT_ID(N'[dbo].[Purchase]')
)
BEGIN
    DROP INDEX [Purchase_patientId_purchaseDate_idx] ON [dbo].[Purchase];
END;

IF OBJECT_ID(N'[dbo].[ProgramStatus]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'ProgramStatus_pkey'
)
BEGIN
    ALTER TABLE [dbo].[ProgramStatus] DROP CONSTRAINT [ProgramStatus_pkey];
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'Purchase_pkey'
)
BEGIN
    ALTER TABLE [dbo].[Purchase] DROP CONSTRAINT [Purchase_pkey];
END;

IF OBJECT_ID(N'[dbo].[Patient]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'Patient_pkey'
)
BEGIN
    ALTER TABLE [dbo].[Patient] DROP CONSTRAINT [Patient_pkey];
END;

IF OBJECT_ID(N'[dbo].[DiscountConfiguration]', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'DiscountConfiguration_pkey'
)
BEGIN
    ALTER TABLE [dbo].[DiscountConfiguration] DROP CONSTRAINT [DiscountConfiguration_pkey];
END;

IF OBJECT_ID(N'[dbo].[Patient]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Patient] ALTER COLUMN [id] NVARCHAR(30) NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Purchase] ALTER COLUMN [id] NVARCHAR(30) NOT NULL;
    ALTER TABLE [dbo].[Purchase] ALTER COLUMN [patientId] NVARCHAR(30) NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[ProgramStatus]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[ProgramStatus] ALTER COLUMN [patientId] NVARCHAR(30) NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[DiscountConfiguration]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[DiscountConfiguration] ALTER COLUMN [id] NVARCHAR(30) NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[Patient]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Patient] ADD CONSTRAINT [Patient_pkey] PRIMARY KEY CLUSTERED ([id]);
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD CONSTRAINT [Purchase_pkey] PRIMARY KEY CLUSTERED ([id]);
END;

IF OBJECT_ID(N'[dbo].[ProgramStatus]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[ProgramStatus] ADD CONSTRAINT [ProgramStatus_pkey] PRIMARY KEY CLUSTERED ([patientId]);
END;

IF OBJECT_ID(N'[dbo].[DiscountConfiguration]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[DiscountConfiguration] ADD CONSTRAINT [DiscountConfiguration_pkey] PRIMARY KEY CLUSTERED ([id]);
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX [Purchase_patientId_purchaseDate_idx] ON [dbo].[Purchase]([patientId], [purchaseDate] DESC);
END;

IF OBJECT_ID(N'[dbo].[Purchase]', N'U') IS NOT NULL
AND OBJECT_ID(N'[dbo].[Patient]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Purchase]
    ADD CONSTRAINT [Purchase_patientId_fkey]
    FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id])
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

IF OBJECT_ID(N'[dbo].[ProgramStatus]', N'U') IS NOT NULL
AND OBJECT_ID(N'[dbo].[Patient]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[ProgramStatus]
    ADD CONSTRAINT [ProgramStatus_patientId_fkey]
    FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id])
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH