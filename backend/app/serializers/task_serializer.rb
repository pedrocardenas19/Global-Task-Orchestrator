class TaskSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :status, :created_at, :updated_at
end
