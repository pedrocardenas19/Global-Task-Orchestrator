require "rails_helper"

RSpec.describe Task, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:task)).to be_valid
    end

    it "is invalid without a title" do
      task = build(:task, title: nil)
      expect(task).not_to be_valid
      expect(task.errors[:title]).to include("can't be blank")
    end

    it "is invalid with a duplicate title" do
      create(:task, title: "Duplicate Title")
      task = build(:task, title: "Duplicate Title")
      expect(task).not_to be_valid
      expect(task.errors[:title]).to include("has already been taken")
    end

    it "is invalid with an unknown status" do
      task = build(:task, status: "unknown")
      expect(task).not_to be_valid
    end
  end

  describe "defaults" do
    it "sets status to pending by default" do
      expect(Task.new(title: "Test").status).to eq("pending")
    end
  end

  describe "serialization" do
    it "exposes the expected fields via TaskSerializer" do
      task = create(:task)
      json = JSON.parse(TaskSerializer.new(task).to_json)
      expect(json["id"]).to be_a(String)
      expect(json.keys).to include("title", "description", "status", "created_at", "updated_at")
    end
  end
end
