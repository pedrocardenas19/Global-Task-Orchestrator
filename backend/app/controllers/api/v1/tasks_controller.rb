module Api
  module V1
    class TasksController < BaseController
      # GET /api/v1/tasks
      # Returns all tasks sorted by creation date descending
      def index
        tasks = Task.all.order_by(created_at: :desc)
        render json: tasks, each_serializer: TaskSerializer, status: :ok
      end

      # POST /api/v1/tasks
      # Delegates creation logic to the Tasks::CreateTask service
      def create
        result = Tasks::CreateTask.new(task_params).call

        if result.success?
          render json: result.task, serializer: TaskSerializer, status: :created
        else
          render json: { errors: result.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def task_params
        params.permit(:title, :description)
      end
    end
  end
end
