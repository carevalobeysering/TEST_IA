BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Patient] (
    [id] NVARCHAR(30) NOT NULL,
    [name] NVARCHAR(120) NOT NULL,
    [uniqueIdentifier] NVARCHAR(80) NOT NULL,
    [registeredAt] DATETIME2 NOT NULL CONSTRAINT [Patient_registeredAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Patient_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Patient_uniqueIdentifier_key] UNIQUE NONCLUSTERED ([uniqueIdentifier])
);

-- CreateTable
CREATE TABLE [dbo].[Purchase] (
    [id] NVARCHAR(30) NOT NULL,
    [patientId] NVARCHAR(30) NOT NULL,
    [purchaseDate] DATETIME2 NOT NULL,
    [dose] NVARCHAR(20) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [Purchase_quantity_df] DEFAULT 1,
    [discountApplied] DECIMAL(10,2) NOT NULL CONSTRAINT [Purchase_discountApplied_df] DEFAULT 0,
    [isValid] BIT NOT NULL CONSTRAINT [Purchase_isValid_df] DEFAULT 1,
    [isFree] BIT NOT NULL CONSTRAINT [Purchase_isFree_df] DEFAULT 0,
    [listPrice] DECIMAL(10,2) NOT NULL,
    [finalPrice] DECIMAL(10,2) NOT NULL,
    [programTypeApplied] NVARCHAR(20) NOT NULL CONSTRAINT [Purchase_programTypeApplied_df] DEFAULT 'FULL_PRICE',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Purchase_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Purchase_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramStatus] (
    [patientId] NVARCHAR(30) NOT NULL,
    [validPurchaseCount] INT NOT NULL CONSTRAINT [ProgramStatus_validPurchaseCount_df] DEFAULT 0,
    [rescueActive] BIT NOT NULL CONSTRAINT [ProgramStatus_rescueActive_df] DEFAULT 0,
    [rescueActivatedAt] DATETIME2,
    [rescueStage] INT,
    [lastValidPurchaseDate] DATETIME2,
    [currentLevel] NVARCHAR(10) NOT NULL CONSTRAINT [ProgramStatus_currentLevel_df] DEFAULT '1',
    [state] NVARCHAR(20) NOT NULL CONSTRAINT [ProgramStatus_state_df] DEFAULT 'ACTIVE',
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProgramStatus_pkey] PRIMARY KEY CLUSTERED ([patientId])
);

-- CreateTable
CREATE TABLE [dbo].[DiscountConfiguration] (
    [id] NVARCHAR(30) NOT NULL,
    [dose] NVARCHAR(20) NOT NULL,
    [level] NVARCHAR(10) NOT NULL,
    [percentage] DECIMAL(5,2),
    [exactAmount] DECIMAL(10,2),
    [isRescue] BIT NOT NULL CONSTRAINT [DiscountConfiguration_isRescue_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DiscountConfiguration_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DiscountConfiguration_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DiscountConfiguration_dose_level_isRescue_key] UNIQUE NONCLUSTERED ([dose],[level],[isRescue])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Patient_uniqueIdentifier_idx] ON [dbo].[Patient]([uniqueIdentifier]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Purchase_patientId_purchaseDate_idx] ON [dbo].[Purchase]([patientId], [purchaseDate] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramStatus_state_idx] ON [dbo].[ProgramStatus]([state]);

-- AddForeignKey
ALTER TABLE [dbo].[Purchase] ADD CONSTRAINT [Purchase_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramStatus] ADD CONSTRAINT [ProgramStatus_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
