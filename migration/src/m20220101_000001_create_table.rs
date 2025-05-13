use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Prompt::Table)
                    .if_not_exists()
                    .col(pk_auto(Prompt::Id))
                    .col(timestamp(Prompt::CreatedAt))
                    .col(text(Prompt::Title))
                    .col(text(Prompt::Description))
                    .col(text(Prompt::Content))
                    .col(text(Prompt::Instructions))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Prompt::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Prompt {
    Table,
    Id,
    CreatedAt,
    Title,
    Description,
    Content,
    Instructions,
}
