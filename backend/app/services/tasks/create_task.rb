module Tasks
  # Service object responsible for creating a new Task.
  # Keeps business logic out of the controller layer.
  class CreateTask
    Result = Struct.new(:success, :task, :errors, keyword_init: true) do
      def success? = success
    end

    def initialize(params)
      @params = params.slice(:title, :description)
    end

    def call
      task = Task.new(@params)

      if task.save
        Result.new(success: true, task: task, errors: nil)
      else
        Result.new(success: false, task: nil, errors: task.errors)
      end
    end
  end
end
