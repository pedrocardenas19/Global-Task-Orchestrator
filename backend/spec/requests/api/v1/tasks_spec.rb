require "rails_helper"

RSpec.describe "Api::V1::Tasks", type: :request do
  let(:json) { JSON.parse(response.body) }

  describe "GET /api/v1/tasks" do
    context "when there are no tasks" do
      it "returns an empty array with status 200" do
        get "/api/v1/tasks"
        expect(response).to have_http_status(:ok)
        expect(json).to eq([])
      end
    end

    context "when there are tasks" do
      before do
        create(:task, title: "Oldest Task",  created_at: 2.days.ago)
        create(:task, title: "Middle Task",  created_at: 1.day.ago)
        create(:task, title: "Newest Task",  created_at: Time.current)
      end

      it "returns all tasks sorted by created_at DESC" do
        get "/api/v1/tasks"
        expect(response).to have_http_status(:ok)
        expect(json.length).to eq(3)
        expect(json.first["title"]).to eq("Newest Task")
        expect(json.last["title"]).to eq("Oldest Task")
      end

      it "returns tasks with the expected fields" do
        get "/api/v1/tasks"
        task = json.first
        expect(task.keys).to include("id", "title", "description", "status", "created_at", "updated_at")
      end
    end
  end

  describe "POST /api/v1/tasks" do
    context "with valid params" do
      it "creates a task and returns 201" do
        post "/api/v1/tasks",
             params: { title: "New Task", description: "A description" }.to_json,
             headers: { "Content-Type" => "application/json" }

        expect(response).to have_http_status(:created)
        expect(json["title"]).to eq("New Task")
        expect(json["description"]).to eq("A description")
        expect(json["status"]).to eq("pending")
      end

      it "persists the task in the database" do
        expect {
          post "/api/v1/tasks",
               params: { title: "Persisted Task" }.to_json,
               headers: { "Content-Type" => "application/json" }
        }.to change(Task, :count).by(1)
      end
    end

    context "without a title" do
      it "returns 422 with error messages" do
        post "/api/v1/tasks",
             params: { description: "No title here" }.to_json,
             headers: { "Content-Type" => "application/json" }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to include("Title can't be blank")
      end
    end

    context "with a duplicate title" do
      before { create(:task, title: "Taken Title") }

      it "returns 422 with error messages" do
        post "/api/v1/tasks",
             params: { title: "Taken Title" }.to_json,
             headers: { "Content-Type" => "application/json" }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to include("Title has already been taken")
      end
    end
  end
end
